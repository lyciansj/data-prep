package org.talend.dataprep.api.service;

import com.netflix.hystrix.*;
import com.wordnik.swagger.annotations.Api;
import com.wordnik.swagger.annotations.ApiOperation;
import com.wordnik.swagger.annotations.ApiParam;
import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.talend.dataprep.api.service.command.CreateDataSet;
import org.talend.dataprep.api.service.command.CreateOrUpdateDataSet;
import org.talend.dataprep.api.service.command.DataSetGetCommand;
import org.talend.dataprep.api.service.command.TransformCommand;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletResponse;
import java.io.InputStream;

@RestController
@Api(value = "api", basePath = "/api", description = "Data Preparation API")
public class DataPreparationAPI {

    public static final HystrixCommandGroupKey TRANSFORM_GROUP = HystrixCommandGroupKey.Factory.asKey("transform"); //$NON-NLS-1$

    public static final HystrixCommandGroupKey DATASET_GROUP = HystrixCommandGroupKey.Factory.asKey("dataset"); //$NON-NLS-1$

    private static final PoolingHttpClientConnectionManager connectionManager = new PoolingHttpClientConnectionManager();

    private static final Log LOG = LogFactory.getLog(DataPreparationAPI.class);

    @Value("${transformation.service.url}")
    private String transformServiceUrl;

    @Value("${dataset.service.url}")
    private String contentServiceUrl;

    public DataPreparationAPI() {
        connectionManager.setMaxTotal(50);
        connectionManager.setDefaultMaxPerRoute(50);
    }

    @RequestMapping(value = "/api/transform/{id}/", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ApiOperation(value = "Transforms a data set given data set id. This operation retrieves data set content and pass it to the transformation service.", notes = "Returns the data set modified with the provided actions.")
    public void transform(
            @RequestParam(value = "actions", defaultValue = "", required = false) @ApiParam(value = "Actions to perform on data set (as JSON format).")  String actions,
            @PathVariable(value = "id") @ApiParam(value = "Data set id.") String dataSetId,
            HttpServletResponse response) {
        if (dataSetId == null) {
            throw new IllegalArgumentException("Data set id cannot be null.");
        }
        if (LOG.isDebugEnabled()) {
            LOG.debug("Transforming dataset id #" + dataSetId + " (pool: " + connectionManager.getTotalStats() + ")...");
        }
        // Configure transformation flow
        HttpClient client = HttpClientBuilder.create().setConnectionManager(connectionManager).build();
        HystrixCommand<InputStream> contentRetrieval = new DataSetGetCommand(client, contentServiceUrl, dataSetId, false, false);
        HystrixCommand<InputStream> transformation = new TransformCommand(client, transformServiceUrl, contentRetrieval, actions);
        // Perform transformation
        try {
            ServletOutputStream outputStream = response.getOutputStream();
            IOUtils.copyLarge(transformation.execute(), outputStream);
            outputStream.flush();
        } catch (Exception e) {
            throw new RuntimeException("Unable to transform data set #" + dataSetId + ".", e);
        }
        if (LOG.isDebugEnabled()) {
            LOG.debug("Transformation of dataset id #" + dataSetId + " done.");
        }
    }

    @RequestMapping(value = "/api/datasets", method = RequestMethod.POST, consumes = MediaType.ALL_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
    @ApiOperation(value = "Create a data set", consumes = MediaType.TEXT_PLAIN_VALUE, produces = MediaType.TEXT_PLAIN_VALUE, notes = "Create a new data set based on content provided in POST body. For documentation purposes, body is typed as 'text/plain' but operation accepts binary content too. Returns the id of the newly created data set.")
    public String create(
            @ApiParam(value = "User readable name of the data set (e.g. 'Finance Report 2015', 'Test Data Set').") @RequestParam(defaultValue = "", required = false) String name,
            @ApiParam(value = "content") InputStream dataSetContent) {
        if (LOG.isDebugEnabled()) {
            LOG.debug("Creating dataset (pool: " + connectionManager.getTotalStats() + ")...");
        }
        HttpClient client = HttpClientBuilder.create().setConnectionManager(connectionManager).build();
        HystrixCommand<String> creation = new CreateDataSet(client, contentServiceUrl, name, dataSetContent);
        String result = creation.execute();
        if (LOG.isDebugEnabled()) {
            LOG.debug("Dataset creation done.");
        }
        return result;
    }

    @RequestMapping(value = "/api/datasets/{id}", method = RequestMethod.PUT, consumes = MediaType.ALL_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
    @ApiOperation(value = "Update a data set by id.", consumes = MediaType.TEXT_PLAIN_VALUE, produces = MediaType.TEXT_PLAIN_VALUE, notes = "Create or update a data set based on content provided in PUT body with given id. For documentation purposes, body is typed as 'text/plain' but operation accepts binary content too. Returns the id of the newly created data set.")
    public String createOrUpdateById(
            @ApiParam(value = "User readable name of the data set (e.g. 'Finance Report 2015', 'Test Data Set').") @RequestParam(defaultValue = "", required = false) String name,
            @ApiParam(value = "Id of the data set to update / create") @PathVariable(value = "id") String id,
            @ApiParam(value = "content") InputStream dataSetContent) {
        if (LOG.isDebugEnabled()) {
            LOG.debug("Creating or updating dataset #" + id + " (pool: " + connectionManager.getTotalStats() + ")...");
        }
        HttpClient client = HttpClientBuilder.create().setConnectionManager(connectionManager).build();
        HystrixCommand<String> creation = new CreateOrUpdateDataSet(client, contentServiceUrl, id, name, dataSetContent);
        String result = creation.execute();
        if (LOG.isDebugEnabled()) {
            LOG.debug("Dataset creation or update for #" + id + " done.");
        }
        return result;
    }

    @RequestMapping(value = "/api/datasets/{id}", method = RequestMethod.GET, consumes = MediaType.ALL_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ApiOperation(value = "Get a data set by id.", produces = MediaType.APPLICATION_JSON_VALUE, notes = "Get a data set based on given id.")
    public void get(@ApiParam(value = "Id of the data set to get") @PathVariable(value = "id") String id,
                    @RequestParam(defaultValue = "true") @ApiParam(name = "metadata", value = "Include metadata information in the response") boolean metadata,
                    @RequestParam(defaultValue = "true") @ApiParam(name = "columns", value = "Include columns metadata information in the response") boolean columns,
            HttpServletResponse response) {
        if (LOG.isDebugEnabled()) {
            LOG.debug("Requesting dataset #" + id + " (pool: " + connectionManager.getTotalStats() + ")...");
        }
        HttpClient client = HttpClientBuilder.create().setConnectionManager(connectionManager).build();
        DataSetGetCommand retrievalCommand = new DataSetGetCommand(client, contentServiceUrl, id, metadata, columns);
        try {
            ServletOutputStream outputStream = response.getOutputStream();
            IOUtils.copyLarge(retrievalCommand.execute(), outputStream);
            outputStream.flush();
            if (LOG.isDebugEnabled()) {
                LOG.debug("Request dataset #" + id + " (pool: " + connectionManager.getTotalStats() + ") done.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Unable to retrieve content for id #" + id + ".", e);
        }
    }

    void setDataSetServiceURL(String dataSetServiceURL) {
        this.contentServiceUrl = dataSetServiceURL;
    }

    void setTransformationServiceURL(String transformationServiceURL) {
        this.transformServiceUrl = transformationServiceURL;
    }

}
